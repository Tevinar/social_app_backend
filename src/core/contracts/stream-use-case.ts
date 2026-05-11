import { type Observable } from 'rxjs';

/**
 * Shared application contract for long-lived event streams.
 *
 * @typeParam Request Input required to open the stream. Use `void` when no
 * input is needed.
 * @typeParam Event One event emitted by the stream.
 */
export interface StreamUseCase<Request, Event> {
  /**
   * Opens the stream for the provided request.
   *
   * @param request Input payload used to scope the stream.
   * @returns Observable stream of emitted events.
   */
  execute(request: Request): Observable<Event>;
}
