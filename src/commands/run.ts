import { Command, Flags } from '@oclif/core';
import { PRINT_COLORS, printBox } from '../utils';
import ProjectRunUtils from '../ProjectRunUtils';

export default class Run extends Command {
  static description = 'Starts project as a service on pm2';

  static examples = [
    `$ justaos run`
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    // flag with no value (--service)
    service: Flags.boolean({})
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);
    const prUtils = new ProjectRunUtils();
    if (prUtils.isProjectFolder()) {
      if (flags.service)
        prUtils.startProjectAsService();
      else
        prUtils.start();
    } else {
      printBox(PRINT_COLORS.FgRed, [`Please run the command in project folder`]);
    }
  }
}
