import { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'

const TodoWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Review project updates', completed: false },
    { id: 2, text: 'Prepare for meeting', completed: true },
    { id: 3, text: 'Update documentation', completed: false }
  ])
  const [newTodo, setNewTodo] = useState('')

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: newTodo.trim(), 
        completed: false 
      }])
      setNewTodo('')
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <h3>Todo Settings</h3>
        <p>Configure your todo lists and preferences here.</p>
      </div>
    )
  }

  return (
    <div className="todo-widget">
      <div className="todo-count-only">{todos.filter(t => !t.completed).length} remaining</div>
      
      <div className="todo-input">
        <input
          type="text"
          placeholder="Add new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo} className="add-todo-btn">
          <Plus size={16} />
        </button>
      </div>

      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <button 
              className="todo-check"
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.completed ? <Check size={16} /> : <div className="todo-checkbox" />}
            </button>
            <span className="todo-text">{todo.text}</span>
            <button 
              className="todo-delete"
              onClick={() => deleteTodo(todo.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TodoWidget