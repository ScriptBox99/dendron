import { ConfigUtils, DVault, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import sinon from "sinon";
import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { CONFIG } from "../../constants";
import { WSUtils } from "../../WSUtils";
import { getActiveEditorBasename } from "../testUtils";
import { expect } from "../testUtilsv2";
import {
  EditorUtils,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: vaults[2].fsPath });
  sinon.stub(PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
  sinon
    .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
    .returns(Promise.resolve(vault));
  return vault;
};

suite("Create Daily Journal Suite", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this);

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        expect(
          getActiveEditorBasename().startsWith("daily.journal")
        ).toBeTruthy();
        done();
      },
    });
  });

  test("default journal vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            ConfigUtils.setNoteLookupProps(
              config,
              "confirmVaultOnCreate",
              false
            );
            const dailyVaultName = VaultUtils.getName(vaults[0]);
            ConfigUtils.setJournalProps(config, "dailyVault", dailyVaultName);
            return config;
          },
          { wsRoot }
        );
        await new CreateDailyJournalCommand().run();
        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            vaults[0].fsPath
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  test("default journal vault set with lookup Confirm", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            ConfigUtils.setNoteLookupProps(
              config,
              "confirmVaultOnCreate",
              true
            );
            const dailyVaultName = VaultUtils.getName(vaults[0]);
            ConfigUtils.setJournalProps(config, "dailyVault", dailyVaultName);
            return config;
          },
          { wsRoot }
        );
        await new CreateDailyJournalCommand().run();
        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            vaults[0].fsPath
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  test("default journal vault not set with lookup Confirm", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            ConfigUtils.setNoteLookupProps(
              config,
              "confirmVaultOnCreate",
              true
            );
            return config;
          },
          { wsRoot }
        );
        stubVaultPick(vaults);
        await new CreateDailyJournalCommand().run();
        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            vaults[2].fsPath
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  test("with config override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setJournalProps(config, "dailyDomain", "bar");
        return config;
      },
      onInit: async () => {
        await new CreateDailyJournalCommand().run();
        expect(
          getActiveEditorBasename().startsWith("bar.journal")
        ).toBeTruthy();
        done();
      },
    });
  });

  test("ignores deprecated config", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key]: "'q'q",
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfCurrent",
          [CONFIG.DAILY_JOURNAL_DOMAIN.key]: "daisy",
          [CONFIG.DEFAULT_JOURNAL_NAME.key]: "journey",
        },
      },
      modConfigCb: (config) => {
        ConfigUtils.setJournalProps(config, "dateFormat", "dd");
        ConfigUtils.setJournalProps(config, "dailyDomain", "daisy");
        ConfigUtils.setJournalProps(config, "name", "journey");
        return config;
      },
      onInit: async ({ wsRoot, vaults }) => {
        const current = await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo.bar.baz",
        });
        await WSUtils.openNote(current);
        await new CreateDailyJournalCommand().run();
        const fname = getActiveEditorBasename();
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        expect(fname).toEqual(`daisy.journey.${dd}.md`);
        done();
      },
    });
  });
});
