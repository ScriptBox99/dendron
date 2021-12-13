import { expect } from "../testUtilsv2";
import { AutoCompletableRegister } from "../../utils/registers/AutoCompletableRegister";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";

suite("AutoCompleterRegister tests", function () {
  test(`WHEN accessing registered command THEN retrieve command`, () => {
    const key = "test-key";
    AutoCompletableRegister.register("test-key", new NoteLookupCommand());
    expect(AutoCompletableRegister.getCmd(key)).toBeTruthy();
  });

  test(`WHEN accessing unregistered command THEN throw`, () => {
    expect(() => AutoCompletableRegister.getCmd("i-dont-exist")).toThrow();
  });
});
