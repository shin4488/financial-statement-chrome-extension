export default class StringUtil {
  static isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value === '';
  }
}
