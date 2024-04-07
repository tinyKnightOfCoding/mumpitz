import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { TodoService } from './todo.service'
import { TodoDto, UpdateTodoRequest } from '@mumpitz/example-api'

@Component({
  selector: 'mz-todo-list',
  standalone: true,
  imports: [],
  template: `
    <ul>
      @for (todo of todos(); track todo.id) {
        <li>
          <span>{{ todo.title }} ({{ todo.isDone ? 'Done' : 'Not Done' }})</span>
          <button type="button" (click)="toggle(todo)">{{ todo.isDone ? 'Uncomplete' : 'Complete' }}</button>
          <button type="button" (click)="delete(todo)">Delete</button>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent {
  readonly todoService = inject(TodoService)
  readonly todos = this.todoService.allTodos

  toggle(todo: TodoDto) {
    this.todoService.update(new UpdateTodoRequest({ title: todo.title, isDone: !todo.isDone }), todo.id)
  }

  delete(todo: TodoDto) {
    this.todoService.delete(todo.id)
  }
}
