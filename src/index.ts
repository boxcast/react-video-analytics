import Analytics from './analytics'

export * from './analytics'
export * from './hooks'
export * from './players'

export function add(a: number, b: number): number {
  return a + b
}

console.log(add(3, 5)) //output: 8

export default Analytics
