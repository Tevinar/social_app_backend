import {
  InvalidNewPasswordError,
  NewPassword,
  NEW_PASSWORD_MIN_LENGTH,
} from './new-password';

describe('NewPassword', () => {
  it('preserves the submitted plaintext value exactly', () => {
    const raw = '  Secret1  ';

    expect(NewPassword.from(raw).value).toBe(raw);
  });

  it('throws when the password is shorter than the minimum length', () => {
    expect(() =>
      NewPassword.from('a'.repeat(NEW_PASSWORD_MIN_LENGTH - 1)),
    ).toThrow(InvalidNewPasswordError);
  });
});
