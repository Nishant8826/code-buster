import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItemComponent } from '../task-item/task-item.component';
import { TodoStore } from '../../services/todo.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  public readonly store = inject(TodoStore);

  clearFilters(): void {
    this.store.setFilter('all');
    this.store.setSearchQuery('');
  }
}
