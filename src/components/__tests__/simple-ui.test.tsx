import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Simple test component
function SimpleForm() {
  const [value, setValue] = React.useState('')
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="simple-form">
      <label htmlFor="input-field">
        Test Input:
        <input
          id="input-field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text here"
        />
      </label>
      <button type="submit" disabled={!value.trim()}>
        Submit
      </button>
      {submitted && <div data-testid="success-message">Form submitted!</div>}
    </form>
  )
}

// Simple loading component
function LoadingComponent({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>
  }
  return <div data-testid="content">Content loaded</div>
}

// Simple list component
function ItemList({ items }: { items: string[] }) {
  return (
    <ul data-testid="item-list">
      {items.map((item, index) => (
        <li key={index} data-testid={`item-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

describe('Simple UI Components', () => {
  describe('SimpleForm', () => {
    it('should render form with input and submit button', () => {
      render(<SimpleForm />)

      expect(screen.getByLabelText(/test input/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter text here/i)).toBeInTheDocument()
    })

    it('should have submit button disabled when input is empty', () => {
      render(<SimpleForm />)

      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when input has value', async () => {
      const user = userEvent.setup()
      render(<SimpleForm />)

      const input = screen.getByLabelText(/test input/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })

      await user.type(input, 'test value')

      expect(submitButton).not.toBeDisabled()
    })

    it('should show success message when form is submitted', async () => {
      const user = userEvent.setup()
      render(<SimpleForm />)

      const input = screen.getByLabelText(/test input/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })

      await user.type(input, 'test value')
      await user.click(submitButton)

      expect(screen.getByTestId('success-message')).toBeInTheDocument()
      expect(screen.getByText('Form submitted!')).toBeInTheDocument()
    })

    it('should update input value when typed', async () => {
      const user = userEvent.setup()
      render(<SimpleForm />)

      const input = screen.getByLabelText(/test input/i) as HTMLInputElement

      await user.type(input, 'hello world')

      expect(input.value).toBe('hello world')
    })

    it('should prevent form submission with only whitespace', async () => {
      const user = userEvent.setup()
      render(<SimpleForm />)

      const input = screen.getByLabelText(/test input/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })

      await user.type(input, '   ')

      expect(submitButton).toBeDisabled()
    })
  })

  describe('LoadingComponent', () => {
    it('should show loading state when isLoading is true', () => {
      render(<LoadingComponent isLoading={true} />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('should show content when isLoading is false', () => {
      render(<LoadingComponent isLoading={false} />)

      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByText('Content loaded')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('should toggle between loading and content states', () => {
      const { rerender } = render(<LoadingComponent isLoading={true} />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()

      rerender(<LoadingComponent isLoading={false} />)

      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  describe('ItemList', () => {
    it('should render empty list when no items', () => {
      render(<ItemList items={[]} />)

      const list = screen.getByTestId('item-list')
      expect(list).toBeInTheDocument()
      expect(list.children).toHaveLength(0)
    })

    it('should render list items correctly', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<ItemList items={items} />)

      expect(screen.getByTestId('item-list')).toBeInTheDocument()
      expect(screen.getByTestId('item-0')).toHaveTextContent('Item 1')
      expect(screen.getByTestId('item-1')).toHaveTextContent('Item 2')
      expect(screen.getByTestId('item-2')).toHaveTextContent('Item 3')
    })

    it('should render correct number of items', () => {
      const items = ['A', 'B', 'C', 'D', 'E']
      render(<ItemList items={items} />)

      const listItems = screen.getAllByTestId(/^item-\d+$/)
      expect(listItems).toHaveLength(5)
    })

    it('should handle single item', () => {
      render(<ItemList items={['Single Item']} />)

      expect(screen.getByTestId('item-0')).toHaveTextContent('Single Item')
      expect(screen.getAllByTestId(/^item-\d+$/)).toHaveLength(1)
    })
  })

  describe('Component Integration', () => {
    it('should work with React hooks and state management', async () => {
      const user = userEvent.setup()
      
      function TestApp() {
        const [items, setItems] = React.useState<string[]>([])
        const [inputValue, setInputValue] = React.useState('')

        const addItem = () => {
          if (inputValue.trim()) {
            setItems([...items, inputValue.trim()])
            setInputValue('')
          }
        }

        return (
          <div>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add item"
              data-testid="add-input"
            />
            <button onClick={addItem} data-testid="add-button">
              Add Item
            </button>
            <ItemList items={items} />
          </div>
        )
      }

      render(<TestApp />)

      const input = screen.getByTestId('add-input')
      const button = screen.getByTestId('add-button')

      // Initially no items
      expect(screen.getByTestId('item-list').children).toHaveLength(0)

      // Add first item
      await user.type(input, 'First item')
      await user.click(button)

      expect(screen.getByTestId('item-0')).toHaveTextContent('First item')
      expect(screen.getByTestId('item-list').children).toHaveLength(1)

      // Add second item
      await user.type(input, 'Second item')
      await user.click(button)

      expect(screen.getByTestId('item-1')).toHaveTextContent('Second item')
      expect(screen.getByTestId('item-list').children).toHaveLength(2)
    })
  })
})