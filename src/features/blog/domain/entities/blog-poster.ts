/**
 * Domain entity representing the public blog poster summary.
 */
export class BlogPoster {
  /**
   * Creates one immutable poster summary.
   *
   * @param params Poster data.
   * @param params.id Stable poster identifier.
   * @param params.name Public poster display name.
   * @returns A blog poster entity.
   */
  static create(params: { id: string; name: string }): BlogPoster {
    return new BlogPoster(params.id, params.name);
  }

  /**
   * Stores immutable poster state.
   *
   * @param id Stable poster identifier.
   * @param name Public poster display name.
   */
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}
