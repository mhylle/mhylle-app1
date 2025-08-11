import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageManagerComponent } from './components/message-manager/message-manager';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MessageManagerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('App1 - Interactive Message System');
}
