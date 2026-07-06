use crate::state::{CalculatorState, Operator};

/// 计算引擎 - 封装所有计算操作
pub struct CalculatorEngine;

impl CalculatorEngine {
    /// 创建一个新状态
    pub fn new_state() -> CalculatorState {
        CalculatorState::new()
    }

    /// 输入数字
    pub fn input_digit(state: &mut CalculatorState, digit: char) {
        state.append_digit(digit);
    }

    /// 输入运算符
    pub fn input_operator(state: &mut CalculatorState, op: Operator) {
        state.set_operator(op);
    }

    /// 执行计算（等号）
    pub fn evaluate(state: &mut CalculatorState) {
        state.calculate();
    }

    /// 清除所有
    pub fn clear(state: &mut CalculatorState) {
        state.clear_all();
    }

    /// 清除当前输入
    pub fn clear_entry(state: &mut CalculatorState) {
        state.clear_entry();
    }

    /// 退格
    pub fn backspace(state: &mut CalculatorState) {
        state.backspace();
    }

    /// 正负号切换
    pub fn negate(state: &mut CalculatorState) {
        state.negate();
    }

    /// 百分号
    pub fn percent(state: &mut CalculatorState) {
        state.percent();
    }

    /// 输入小数点
    pub fn decimal_point(state: &mut CalculatorState) {
        state.append_digit('.');
    }

    /// 获取格式化显示值
    pub fn get_display(state: &CalculatorState) -> String {
        state.formatted_display()
    }

    /// 获取表达式
    pub fn get_expression(state: &CalculatorState) -> String {
        state.expression.clone()
    }

    /// 获取原始的 current_input
    pub fn get_raw_input(state: &CalculatorState) -> String {
        state.current_input.clone()
    }

    /// 是否有错误
    pub fn has_error(state: &CalculatorState) -> bool {
        state.has_error
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_workflow() {
        let mut state = CalculatorEngine::new_state();
        CalculatorEngine::input_digit(&mut state, '2');
        CalculatorEngine::input_operator(&mut state, Operator::Add);
        CalculatorEngine::input_digit(&mut state, '3');
        CalculatorEngine::evaluate(&mut state);
        assert_eq!(CalculatorEngine::get_display(&state), "5");
    }

    #[test]
    fn test_complex_workflow() {
        let mut state = CalculatorEngine::new_state();
        CalculatorEngine::input_digit(&mut state, '1');
        CalculatorEngine::input_digit(&mut state, '0');
        CalculatorEngine::input_operator(&mut state, Operator::Multiply);
        CalculatorEngine::input_digit(&mut state, '5');
        CalculatorEngine::evaluate(&mut state);
        assert_eq!(CalculatorEngine::get_display(&state), "50");

        // 连续运算 50 + 3
        CalculatorEngine::input_operator(&mut state, Operator::Add);
        CalculatorEngine::input_digit(&mut state, '3');
        CalculatorEngine::evaluate(&mut state);
        assert_eq!(CalculatorEngine::get_display(&state), "53");
    }
}
