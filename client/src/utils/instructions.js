const stepMarker = /^(?:step\s*)?\d+\s*[.):-]?$/i

export function parseInstructions(value) {
  if (typeof value !== 'string') return []

  const lines = value.split(/\r?\n/).map((line) => line.trim())
  const hasStepMarkers = lines.some((line) => stepMarker.test(line))

  if (!hasStepMarkers) return lines.filter(Boolean)

  const steps = []
  let currentStep = []

  function addCurrentStep() {
    if (!currentStep.length) return
    steps.push(currentStep.join(' '))
    currentStep = []
  }

  for (const line of lines) {
    if (stepMarker.test(line)) {
      addCurrentStep()
    } else if (line) {
      currentStep.push(line)
    }
  }

  addCurrentStep()
  return steps
}
