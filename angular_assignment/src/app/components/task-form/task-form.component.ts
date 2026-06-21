import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TodoStore } from '../../services/todo.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent {
  private store = inject(TodoStore);

  showDescription = signal<boolean>(false);
  taskTitle = '';
  taskDescription = '';

  toggleDescription(): void {
    this.showDescription.update(show => !show);
    if (!this.showDescription()) {
      this.taskDescription = '';
    }
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      this.store.addTodo(this.taskTitle, this.taskDescription);
      form.resetForm();
      this.showDescription.set(false);
    }
  }
}
