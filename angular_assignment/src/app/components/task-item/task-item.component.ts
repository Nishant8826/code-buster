import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Todo } from '../../models/todo.model';
import { TodoStore } from '../../services/todo.service';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent implements OnInit {
  todo = input.required<Todo>();

  isEditing = false;
  editForm!: FormGroup;

  private fb = inject(FormBuilder);
  private store = inject(TodoStore);

  ngOnInit(): void {
    this.editForm = this.fb.group({
      title: [this.todo().title, [Validators.required, Validators.maxLength(100)]],
      description: [this.todo().description || '', [Validators.maxLength(500)]]
    });
  }

  toggleComplete(): void {
    this.store.toggleCompleted(this.todo().id);
  }

  startEdit(): void {
    this.isEditing = true;
    this.editForm.setValue({
      title: this.todo().title,
      description: this.todo().description || ''
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveEdit(): void {
    if (this.editForm.valid) {
      const { title, description } = this.editForm.value;
      this.store.updateTodo(this.todo().id, {
        title: title.trim(),
        description: description.trim() || undefined
      });
      this.isEditing = false;
    }
  }

  deleteTask(): void {
    this.store.deleteTodo(this.todo().id);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
