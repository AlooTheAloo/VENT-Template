import { getCurrentInstance, onUnmounted } from "vue";

declare global {
  interface Window {
    _rpcInvoke: (api: string, ...args: any[]) => Promise<unknown>;
    _rpcSetSuspend: (suspended: boolean) => void;
    _rpcHandle: (
      api: string,
      handler: (...args: any[]) => any,
      canonical?: boolean,
    ) => () => void;
  }
}
const { _rpcInvoke, _rpcSetSuspend, _rpcHandle } = window;

export const rpcHandle: typeof _rpcHandle = function (api, handler, canonical) {
  const dispose = _rpcHandle(api, handler, canonical);
  //We are in a vue context
  if (getCurrentInstance()) {
    onUnmounted(dispose);
  }

  return dispose;
};

export { _rpcInvoke as rpcInvoke, _rpcSetSuspend as rpcSetSuspend };
