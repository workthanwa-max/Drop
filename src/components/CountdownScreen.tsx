type CountdownScreenProps = {
  value: number
}

export function CountdownScreen({ value }: CountdownScreenProps) {
  return (
    <section className="countdown-screen" aria-live="polite">
      <p className="eyebrow">เตรียมตัว</p>
      <strong>{value}</strong>
    </section>
  )
}
