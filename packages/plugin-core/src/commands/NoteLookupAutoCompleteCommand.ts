import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { AutoCompletableRegister } from "../utils/registers/AutoCompletableRegister";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class NoteLookupAutoCompleteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    await AutoCompletableRegister.getCmd(
      DENDRON_COMMANDS.LOOKUP_NOTE.key
    ).onAutoComplete();
  }
}
