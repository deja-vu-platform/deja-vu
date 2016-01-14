import {Component} from 'angular2/core';
import {FeedComponent} from './components/feed/feed';

@Component({
  selector: 'feed-pattern',
  template: `
    <h1>Feed(User)</h1>
    <feed username="Ben">Loading...</feed>
  `,
  directives: [FeedComponent]
})
export class FeedPatternComponent {
  public title = 'Feed Pattern';
}
