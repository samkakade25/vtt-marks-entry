import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MarksEntryComponent } from '../components/marks-entry/marks-entry.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MarksEntryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
}
