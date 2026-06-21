import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { TodoStore } from './services/todo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TaskFormComponent,
    TaskListComponent,
    FilterBarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public store = inject(TodoStore);
}
