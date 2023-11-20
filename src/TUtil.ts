import { ActionGenerator } from "./tanim";

export default class TUtil {
	static easing = {
		linear(x: number): number {
			return x;
		},
		easeInOutQuad(x: number): number {
			return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
		},
		easeInQuad(x: number): number {
			return x * x;
		},
		easeOutQuad(x: number): number {
			return 1 - (1 - x) * (1 - x);
		},
	};
	static lerp(a: number, b: number, t: number) {
		return (1 - t) * a + t * b;
	}

	static *parallel(actions: ActionGenerator[]): ActionGenerator {
		while (actions.length > 0) {
			const delta = yield;
			const removeIndices: number[] = [];
			for (let i = 0; i < actions.length; i++) {
				const result = actions[i].next(delta);
				if (result.done) {
					removeIndices.push(i);
				}
			}
			actions = actions.filter((_, i) => !removeIndices.includes(i));
		}
	}
}