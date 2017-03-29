import Component, { tracked } from "@glimmer/component";

export default class ComponentTest extends Component {
  @tracked numPoints = 1000;

  updateCount(event) {
    this.numPoints = event.target.value;
  }
}
