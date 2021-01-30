import { Command, flags } from '@oclif/command';
import { PRINT_COLORS, printBox } from '../utils';
import ProjectRunUtils from '../ProjectRunUtils';

export default class Run extends Command {
  static description = 'Starts project as a service on pm2';

  static examples = [
    `$ p4rm run`
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with no value (--service)
    service: flags.boolean({})
  };

  async run() {
    const { args, flags } = this.parse(Run);
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
