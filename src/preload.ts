// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");
declare const PROD: boolean;

function rpcLog(...stuff) {
  //TODO: handle promise
  void ipcRenderer.send("RPC:Log", ...stuff);
}

//const rpcWhitelist = ["State:DashboardConnected", "Page:Dashboard:Action:ClickedMap"]

/**
 * Calls a function on the main process
 * @param api {string}
 * @param args {unknown[]}
 *
 * @returns {Promise<unknown>}
 */
function rpcInvoke(api, ...args) {
  //if(!rpcWhitelist.includes(api)) throw Error("Attempted to call unauthorized api: " + api);
  rpcLog(`Renderer -Invoke> Main: ${api}`, args);

  const retVal = ipcRenderer.invoke(api, ...args);
  retVal.then(val => {
    rpcLog(`Renderer <Response- Main: ${api}`, val);
  });
  return retVal;
}

type RpcHandler = (...args: unknown[]) => unknown;

const rpcHandlers: Map<string, Map<symbol, RpcHandler>> = new Map();
const canonicalRpcHandlers: Map<string, [symbol, RpcHandler]> = new Map();
/**
 * Handles a remote procedure call
 * @param api {string}
 * @param handler {RpcHandler}
 * @param canonical {boolean}
 */
function rpcHandle(api, handler: RpcHandler, canonical) {
  const handlerId = Symbol(`Handler(${handler}) for ${api}`);

  if (canonical) {
    if (canonicalRpcHandlers.get(api))
      throw Error(
        `A canonical RPC handler has already been defined for API ${api}`,
      );

    canonicalRpcHandlers.set(api, [handlerId, handler]);
  } else {
    const handlers = rpcHandlers.get(api) ?? new Map<symbol, RpcHandler>();
    handlers.set(handlerId, handler);
    rpcHandlers.set(api, handlers);

    if (handlers.size > 5)
      console.warn(
        `Something sus is going on, the ${api} api has more than 5 handlers`,
      );
  }

  return () => {
    if (canonical) {
      const canonicalHandler = canonicalRpcHandlers.get(api);
      if (canonicalHandler?.[0] === handlerId) {
        canonicalRpcHandlers.delete(api);
      }
    } else {
      const handlers = rpcHandlers.get(api);
      if (handlers?.get(handlerId)) {
        handlers.delete(handlerId);
      }
    }
  };
}

ipcRenderer.on("RPC:Invoke", (_event, { api, id, args }) => {
  const handlers = [...(rpcHandlers.get(api) ?? new Map<symbol, RpcHandler>())];
  if (canonicalRpcHandlers.has(api))
    handlers.unshift(canonicalRpcHandlers.get(api)!);

  if (handlers.length === 0) {
    ipcRenderer.send("RPC:Response", {
      id: id,
      status: "no_handler",
    });
    return;
  }

  //This is the handler we send the result of back
  Promise.resolve(handlers[0][1](...args))
    .then(value => {
      ipcRenderer.send("RPC:Response", {
        id: id,
        status: "ok",
        result: value,
      });
    })
    .catch(e => {
      ipcRenderer.send("RPC:Response", {
        id: id,
        status: "error",
        error: e,
      });
    });

  for (const handler of handlers.slice(1)) {
    try {
      handler[1](...args);
    } catch (e) {
      console.warn("A non canonical promise has errored", e);
    }
  }
});



ipcRenderer.on("RPC:Reset", () => {
  rpcHandlers.clear();
  canonicalRpcHandlers.clear();
});

function rpcSetSuspend(newState) {
  ipcRenderer.send("RPC:SetSuspend", newState);
}

contextBridge.exposeInMainWorld("_rpcInvoke", rpcInvoke);
contextBridge.exposeInMainWorld("_rpcHandle", rpcHandle);
contextBridge.exposeInMainWorld("_rpcSetSuspend", rpcSetSuspend);

if (PROD) {
  contextBridge.exposeInMainWorld("_getHandlers", () =>
    console.log(rpcHandlers),
  );
}
