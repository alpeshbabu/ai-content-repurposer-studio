// Basic test to verify Jest is working
describe('Basic Test Suite', () => {
  it('should run basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(Math.max(1, 2, 3)).toBe(3)
  })

  it('should handle string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO')
    expect('test string'.includes('test')).toBe(true)
  })

  it('should handle array operations', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })

  it('should mock functions properly', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})