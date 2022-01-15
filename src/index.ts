import { commands, ExtensionContext, workspace, window, Buffer, Neovim } from 'coc.nvim';
import { quicktype, InputData, jsonInputForTargetLanguage, JSONSchemaInput, FetchingJSONSchemaStore} from 'quicktype-core';

/// Custom settings for each language
/// This is also where supported languages are checked
const rendererOptions = {
  'rust': {
    "density": "dense",
    "visibility": "private",
    "leading-comments": "false",

    "derive-debug": "true",
    "edition-2018": "true",
  },

  // There are no custom setting set for these
  'typescript': {},
  'go': {},
  'ruby': {},
  'javascript': {},
  'flow': {},
  'kotlin': {},
  'dart': {},
  'python': {},
  'cs': {},
  'cpp': {},
  'java': {},
  'swift': {},
  'elm': {},
  'pike': {},
  'haskell': {},
  // These are not supported for no good reason
  //'objc': {},
  //'Json Schema': {},
  //'Prop-Types': {},
};

async function convert(lines: string[], nvim: Neovim, targetLanguage: string, output_buffer: Buffer): Promise<boolean> {
  const json_text = lines.join('\n').trim();
  if(json_text == '') {
    return false;
  }
  const [line, _col] = await (await nvim.window).cursor;
  // TODO: pick language based on the language of the buffer we're inserting into
  const jsonInput = jsonInputForTargetLanguage(targetLanguage);
  await jsonInput.addSource({
    name: 'ParsedJson',
    samples: [json_text],
  });
  const inputData = new InputData();
  inputData.addInput(jsonInput);
  const { lines: result } = await quicktype({
    inputData,
    lang: targetLanguage,
    rendererOptions: rendererOptions[targetLanguage],
  });

  await output_buffer.setLines(result, { start: line, end: line });
  return true;
}

export async function activate(context: ExtensionContext): Promise<void> {

  const [row, col] = [7, 18];
  const [min_height, min_width] = [10, 50];

  const { nvim } = workspace;
  const buffer = await nvim.createNewBuffer(false, true);
  context.subscriptions.push(
    commands.registerCommand('quicktype.jsonToCode', async () => {
      const output_buffer = await nvim.buffer;
      const targetLanguage = (await output_buffer.getOption('syntax')).valueOf().toString();
      if(rendererOptions[targetLanguage] === undefined) {
        window.showMessage(`Language ${targetLanguage} is not supported yet`);
        return;
      }
      try {
        const reg = await nvim.getVvar('register');
        const lines = [(await nvim.call('getreg', [reg])).valueOf().toString()];
        window.showMessage(lines[0]);
        if (await convert(lines, nvim, targetLanguage, output_buffer)) {
          return;
        }
      } catch(e) {
        try {
          const lines_2 = [nvim.call('getreg', ['+']).valueOf().toString()];
          if(await convert(lines_2, nvim, targetLanguage, output_buffer)) {
            return;
          }
        } catch(e) {}
      }
      const outerWindow = await nvim.window;
      const [win_row, win_col] = await outerWindow.position;
      const width = Math.max(await outerWindow.width - col * 2, min_width);
      const height = Math.max(await outerWindow.height - row * 2, min_height);
      const input_window = await nvim.openFloatWindow(buffer, true, {
        height: height,
        width: width,
        row: row + win_row,
        col: col + win_col,
        focusable: true,
        relative: 'editor', //'editor' | 'cursor' | 'win',
      });
      await input_window.setOption('number', false);
      await input_window.setOption('relativenumber', false);
      await input_window.setOption('colorcolumn', '');
      workspace.registerAutocmd({
        event: 'InsertLeave',
        pattern: `<buffer=${buffer.id}>`,
        callback: async () => {
          await input_window.close(true);
          const lines = await buffer.lines;
          await buffer.setLines([], { start: 0, end: lines.length });
          await convert(lines, nvim, targetLanguage, output_buffer);
        },
      });
      nvim.command('startinsert');
    })
  );
}
