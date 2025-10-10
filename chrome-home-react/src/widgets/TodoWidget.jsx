import { useState, useEffect } from 'react'
import { Plus, Check, X, GripVertical } from 'lucide-react'
import { storage } from '../utils/storage'
import { ReactSortable } from 'react-sortablejs'

const TodoWidget = ({ isConfigMode }) => {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load todos from storage on mount
  useEffect(() => {
    storage.sync.get(['todos'], (result) => {
      if (result.todos && result.todos.length > 0) {
        setTodos(result.todos)
      } else {
        // Set default todos if none exist
        const defaultTodos = [
          { id: 1, text: 'Review project updates', completed: false },
          { id: 2, text: 'Prepare for meeting', completed: true },
          { id: 3, text: 'Update documentation', completed: false }
        ]
        setTodos(defaultTodos)
        storage.sync.set({ todos: defaultTodos })
      }
      setIsLoaded(true)
    })
  }, [])
  
  // Save todos to storage whenever they change
  useEffect(() => {
    if (isLoaded && todos.length >= 0) {
      storage.sync.set({ todos })
    }
  }, [todos, isLoaded])

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

      <ReactSortable 
        list={todos} 
        setList={setTodos}
        animation={200}
        handle=".todo-drag-handle"
        className="todo-list"
        ghostClass="todo-ghost"
        dragClass="todo-drag"
      >
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <div className="todo-drag-handle" title="Drag to reorder">
              <GripVertical size={14} />
            </div>
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
      </ReactSortable>
    </div>
  )
}

export default TodoWidget