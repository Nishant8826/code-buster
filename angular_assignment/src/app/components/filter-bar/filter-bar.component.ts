import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoStore } from '../../services/todo.service';
import { TodoFilter } from '../../models/todo.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css']
})
export class FilterBarComponent {
  public readonly store = inject(TodoStore);

  setFilter(filter: TodoFilter): void {
    this.store.setFilter(filter);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearchQuery(value);
  }

  clearSearch(): void {
    this.store.setSearchQuery('');
  }
}
