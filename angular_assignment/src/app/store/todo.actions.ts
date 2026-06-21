import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Todo, TodoFilter } from '../models/todo.model';

export const TodoActions = createActionGroup({
  source: 'Todo Store',
  events: {
    'Load Todos': emptyProps(),
    'Load Todos Success': props<{ todos: Todo[] }>(),
    'Load Todos Failure': props<{ error: string }>(),
    'Add Todo': props<{ todo: Todo }>(),
    'Update Todo': props<{ id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }>(),
    'Delete Todo': props<{ id: string }>(),
    'Toggle Completed': props<{ id: string }>(),
    'Set Filter': props<{ filter: TodoFilter }>(),
    'Set Search Query': props<{ query: string }>()
  }
});
