import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TodoState } from './todo.reducer';

export const selectTodoState = createFeatureSelector<TodoState>('todo');

export const selectAllTodos = createSelector(
  selectTodoState,
  (state) => state.todos
);

export const selectFilter = createSelector(
  selectTodoState,
  (state) => state.filter
);

export const selectSearchQuery = createSelector(
  selectTodoState,
  (state) => state.searchQuery
);

export const selectFilteredTodos = createSelector(
  selectAllTodos,
  selectFilter,
  selectSearchQuery,
  (todos, filter, searchQuery) => {
    const query = searchQuery.toLowerCase().trim();
    return todos.filter((todo) => {
      const matchesSearch =
        todo.title.toLowerCase().includes(query) ||
        (todo.description && todo.description.toLowerCase().includes(query));

      if (filter === 'completed') {
        return matchesSearch && todo.completed;
      } else if (filter === 'pending') {
        return matchesSearch && !todo.completed;
      }
      return matchesSearch;
    });
  }
);

export const selectTotalCount = createSelector(
  selectAllTodos,
  (todos) => todos.length
);

export const selectCompletedCount = createSelector(
  selectAllTodos,
  (todos) => todos.filter((t) => t.completed).length
);

export const selectPendingCount = createSelector(
  selectAllTodos,
  (todos) => todos.filter((t) => !t.completed).length
);
