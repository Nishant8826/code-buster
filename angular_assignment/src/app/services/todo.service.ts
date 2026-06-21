import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TodoActions } from '../store/todo.actions';
import { 
  selectFilteredTodos, 
  selectFilter, 
  selectSearchQuery, 
  selectTotalCount, 
  selectCompletedCount, 
  selectPendingCount 
} from '../store/todo.selectors';
import { Todo, TodoFilter } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoStore {
  private readonly store = inject(Store);

  public readonly filteredTodos = this.store.selectSignal(selectFilteredTodos);
  public readonly filter = this.store.selectSignal(selectFilter);
  public readonly searchQuery = this.store.selectSignal(selectSearchQuery);
  public readonly totalCount = this.store.selectSignal(selectTotalCount);
  public readonly completedCount = this.store.selectSignal(selectCompletedCount);
  public readonly pendingCount = this.store.selectSignal(selectPendingCount);

  constructor() {
    this.store.dispatch(TodoActions.loadTodos());
  }

  setFilter(filter: TodoFilter): void {
    this.store.dispatch(TodoActions.setFilter({ filter }));
  }

  setSearchQuery(query: string): void {
    this.store.dispatch(TodoActions.setSearchQuery({ query }));
  }

  addTodo(title: string, description?: string): void {
    const todo: Todo = {
      id: crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2, 7)),
      title: title.trim(),
      description: description?.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.store.dispatch(TodoActions.addTodo({ todo }));
  }

  updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): void {
    this.store.dispatch(TodoActions.updateTodo({ id, updates }));
  }

  deleteTodo(id: string): void {
    this.store.dispatch(TodoActions.deleteTodo({ id }));
  }

  toggleCompleted(id: string): void {
    this.store.dispatch(TodoActions.toggleCompleted({ id }));
  }
}
