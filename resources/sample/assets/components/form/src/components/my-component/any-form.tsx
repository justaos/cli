import { Component, Prop, h } from '@stencil/core';
import { format } from '../../utils/utils';

@Component({
  tag: 'any-form',
  styleUrl: 'any-form.css',
  shadow: true
})
export class AnyForm {
  /**
   * The first name
   */
  @Prop() collection: string;


  render() {
    return <div>Hello, World! I'm {this.collection}</div>;
  }
}
