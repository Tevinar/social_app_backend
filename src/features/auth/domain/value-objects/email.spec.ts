import { Email, InvalidEmailError } from './email';

describe('Email', () => {
  it('normalizes surrounding whitespace and casing', () => {
    expect(Email.from('  USER@Example.COM ').value).toBe('user@example.com');
  });

  it('throws when the input is malformed', () => {
    expect(() => Email.from('not-an-email')).toThrow(InvalidEmailError);
  });
});
