/**
 * Shared asynchronous application use-case contract.
 *
 * This interface provides a consistent execution shape across features while
 * staying independent from transport, framework, and persistence concerns.
 *
 * @typeParam Request Input required to execute the use case. Use `void` when
 * the use case does not require any input.
 * @typeParam Response Successful result returned by the use case.
 */
export interface UseCase<Request, Response> {
  /**
   * Executes the use case with the provided request data.
   *
   * @param request Input payload required by the use case.
   * @returns A promise that resolves to the successful use-case result.
   */
  execute(request: Request): Promise<Response>;
}
