/**
 * Returns a middleware that implements the following RPC methods:
 * - metamask_logInjectedWeb3Usage
 * @returns {(req: any, res: any, next: Function, end: Function) => void}
 */
export default function createMethodMiddleware () {
  return function methodMiddleware (req, res, next, end) {
    switch (req.method) {
      case 'metamask_logInjectedWeb3Usage': {
        res.result = true
        break
      }
      default:
        return next()
    }
    return end()
  }
}
