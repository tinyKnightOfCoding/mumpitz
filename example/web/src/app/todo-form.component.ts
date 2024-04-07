import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { TodoService } from './todo.service'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CreateTodoRequest } from '@mumpitz/example-api'

@Component({
  selector: 'mz-todo-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (submit)="submit()">
      <input type="text" formControlName="title" />
      <button type="submit">Add</button>
    </form>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoFormComponent {
  readonly todoService = inject(TodoService)
  readonly fb = inject(FormBuilder)
  readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', Validators.required),
  })

  submit() {
    this.form.markAsTouched()
    this.form.markAsDirty()
    if (this.form.invalid) return
    const request: CreateTodoRequest = new CreateTodoRequest(this.form.getRawValue())
    this.todoService.create(request)
    this.form.reset()
  }
}
