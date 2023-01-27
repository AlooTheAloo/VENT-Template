import { ipcMain } from "electron";

const enableRPCLogging = false;
function rpcLog(...stuff) {
  if (!enableRPCLogging) return;

  console.log(`(RPC)`, ...stuff);
}

let RPCSuspended = true;
const suspendedCalls: [Function, Function][] = [];

const rpcReply: Map<
  bigint,
  [resolve: (value: any) => void, reject: (reason?: any) => void]
> = new Map();
/**
 * Calls a function in the renderer
 * @param api {string}
 * @param args {...unknown[]}
 *
 * @returns {Promise<unknown>}
 */
async function rpcInvoke(api, ...args) {
  if (RPCSuspended) {
    rpcLog(
      `RPC suspended, call intercepted. ${
        suspendedCalls.length + 1
      } RPCs waiting.`,
    );
    await new Promise((resolve, reject) =>
      suspendedCalls.push([resolve, reject]),
    );
  }

  return new Promise((resolve, reject) => {
    const id = process.hrtime.bigint();
    rpcReply.set(id, [resolve, reject]);

    rpcLog(`Main -Invoke> Renderer(${id}): ${api}`, args);
    mainWindow.webContents.send("RPC:Invoke", { api, id, args });
  });
}

function rpcSetSuspend(newState: boolean) {
  rpcLog(
    `RPC is now ${newState ? "" : "un"}suspended. ${
      suspendedCalls.length
    } calls waiting.`,
  );
  RPCSuspended = newState;
  if (RPCSuspended) return;

  //Unsuspend all calls
  while (suspendedCalls.length) {
    suspendedCalls.shift()![0]();
  }
}

function rpcReset() {
  rpcSetSuspend(true);
  suspendedCalls.forEach(([, reject]) => reject("RPC Reset"));
  rpcReply.clear();

  mainWindow.webContents.send("RPC:Reset");
}

ipcMain.on("RPC:Response", (_event, { id, status, error, result }) => {
  if (status === "no_handler")
    rpcLog(`Main <Response- Renderer(${id}): ${status}`);
  else rpcLog(`Main <Response- Renderer(${id}): ${status}`, error ?? result);

  if (!rpcReply.has(id)) return;

  const [resolve, reject] = rpcReply.get(id)!;

  if (status === "ok") {
    resolve(result);
  } else if (status === "no_handler") {
    //reject("no_handler");
    //TODO: fix promise handling all over the app
    resolve(undefined);
  } else {
    console.warn("An RPC call has failed: ", error);
    reject(error);
  }
});

ipcMain.on("RPC:SetSuspend", (_event, newState) => {
  rpcSetSuspend(newState);
});

ipcMain.on("RPC:Log", (_event, ...args) => {
  rpcLog(...args);
});

export { rpcInvoke, rpcSetSuspend, rpcReset };
