import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TodoListComponent } from './todo-list.component'
import { TodoFormComponent } from './todo-form.component'

@Component({
  selector: 'mz-root',
  standalone: true,
  imports: [RouterOutlet, TodoListComponent, TodoFormComponent],
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <h1>Your Todos</h1>
    <mz-todo-list></mz-todo-list>
    <mz-todo-form></mz-todo-form>
  `,
})
export class AppComponent {}
