import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { TodoActions } from './todo.actions';
import { selectAllTodos } from './todo.selectors';
import { Todo } from '../models/todo.model';

@Injectable()
export class TodoEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);
  
  private isBrowser = isPlatformBrowser(this.platformId);
  private STORAGE_KEY = 'taskflow_todos';

  loadTodos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TodoActions.loadTodos),
      mergeMap(() => {
        const defaultTodos: Todo[] = [
          {
            id: 'seed-1',
            title: 'Welcome to Code Buster! ✨',
            description: 'This is a premium, client-side To-Do app. Try adding your own tasks!',
            completed: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'seed-2',
            title: 'Mark this task as completed',
            description: 'Click the checkbox on the left to mark this task as done.',
            completed: true,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'seed-3',
            title: 'Search and Filter tasks',
            description: 'Use the filter buttons and search input in the toolbar to filter this list.',
            completed: false,
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];

        if (!this.isBrowser) {
          return of(TodoActions.loadTodosSuccess({ todos: defaultTodos }));
        }

        try {
          const stored = localStorage.getItem(this.STORAGE_KEY);
          if (stored) {
            return of(TodoActions.loadTodosSuccess({ todos: JSON.parse(stored) }));
          } else {
            return of(TodoActions.loadTodosSuccess({ todos: defaultTodos }));
          }
        } catch (e) {
          console.error('Failed to load todos from localStorage', e);
          return of(TodoActions.loadTodosFailure({ error: 'Failed to load from storage' }));
        }
      })
    )
  );

  saveTodos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TodoActions.addTodo,
        TodoActions.updateTodo,
        TodoActions.deleteTodo,
        TodoActions.toggleCompleted,
        TodoActions.loadTodosSuccess
      ),
      withLatestFrom(this.store.select(selectAllTodos)),
      tap(([action, todos]) => {
        if (this.isBrowser) {
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
          } catch (e) {
            console.error('Failed to save todos to localStorage', e);
          }
        }
      })
    ),
    { dispatch: false }
  );
}
