import type { Meta, StoryObj } from '@storybook/react';
import { CalcButton, ButtonGrid } from '../../src/components/Button';

const meta: Meta<typeof CalcButton> = {
  title: 'Components/CalcButton',
  component: CalcButton,
  argTypes: {
    variant: { control: 'select', options: ['number', 'operator', 'function', 'equals'] },
  },
};
export default meta;

type Story = StoryObj<typeof CalcButton>;

export const NumberButton: Story = {
  args: { children: '7', variant: 'number', onClick: () => {} },
};

export const OperatorButton: Story = {
  args: { children: '+', variant: 'operator', onClick: () => {} },
};

export const FunctionButton: Story = {
  args: { children: 'C', variant: 'function', onClick: () => {} },
};

export const EqualsButton: Story = {
  args: { children: '=', variant: 'equals', onClick: () => {} },
};

export const ButtonGridLayout: StoryObj = {
  render: () => (
    <ButtonGrid>
      <CalcButton variant="function" onClick={() => {}}>%</CalcButton>
      <CalcButton variant="function" onClick={() => {}}>C</CalcButton>
      <CalcButton variant="function" onClick={() => {}}>⌫</CalcButton>
      <CalcButton variant="operator" onClick={() => {}}>÷</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>7</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>8</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>9</CalcButton>
      <CalcButton variant="operator" onClick={() => {}}>×</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>4</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>5</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>6</CalcButton>
      <CalcButton variant="operator" onClick={() => {}}>−</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>1</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>2</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>3</CalcButton>
      <CalcButton variant="operator" onClick={() => {}}>+</CalcButton>
      <CalcButton variant="function" onClick={() => {}}>±</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>0</CalcButton>
      <CalcButton variant="number" onClick={() => {}}>.</CalcButton>
      <CalcButton variant="equals" onClick={() => {}}>=</CalcButton>
    </ButtonGrid>
  ),
};
