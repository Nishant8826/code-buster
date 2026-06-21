import { createReducer, on } from '@ngrx/store';
import { Todo, TodoFilter } from '../models/todo.model';
import { TodoActions } from './todo.actions';

export interface TodoState {
  todos: Todo[];
  filter: TodoFilter;
  searchQuery: string;
  error: string | null;
}

export const initialState: TodoState = {
  todos: [],
  filter: 'all',
  searchQuery: '',
  error: null
};

export const todoReducer = createReducer(
  initialState,
  on(TodoActions.loadTodosSuccess, (state, { todos }) => ({
    ...state,
    todos,
    error: null
  })),
  on(TodoActions.loadTodosFailure, (state, { error }) => ({
    ...state,
    error
  })),
  on(TodoActions.addTodo, (state, { todo }) => ({
    ...state,
    todos: [todo, ...state.todos]
  })),
  on(TodoActions.updateTodo, (state, { id, updates }) => ({
    ...state,
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, ...updates } : todo
    )
  })),
  on(TodoActions.deleteTodo, (state, { id }) => ({
    ...state,
    todos: state.todos.filter((todo) => todo.id !== id)
  })),
  on(TodoActions.toggleCompleted, (state, { id }) => ({
    ...state,
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })),
  on(TodoActions.setFilter, (state, { filter }) => ({
    ...state,
    filter
  })),
  on(TodoActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query
  }))
);
