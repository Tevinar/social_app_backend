import {
  InvalidNameError,
  Name,
} from './name';

describe('Name', () => {
  it('trims surrounding whitespace', () => {
    expect(Name.from('  Ada Lovelace  ').value).toBe('Ada Lovelace');
  });

  it('throws when the input has fewer than the minimum non-blank characters', () => {
    expect(() => Name.from(' A B ')).toThrow(InvalidNameError);
  });
});
