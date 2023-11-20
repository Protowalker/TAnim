export default function createView(canvas: HTMLCanvasElement) {
	const view = new View(canvas);
	return view;
}

type RenderMode = "live" | "prerender";
export type EasingFunction = (x: number) => number;
export type TweenFunction<T> = {
	(): T;
	(
		newValue: T,
		duration?: number,
		easingFunction?: EasingFunction
	): ActionGenerator;
};

export type TweenType<T extends TweenFunction<any>> = Parameters<T>[0];

export type ComponentProps<T> = {
	[Prop in keyof T]: T[Prop] extends TweenFunction<any>
		? TweenType<T[Prop]>
		: T[Prop];
};

// export type TweenFunction<T> = (() => T)
//	| ((newValue: T, duration?: number) => ActionGenerator);

export class View {
	renderMode: RenderMode = "live";
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	components: Component[] = [];
	lastTime: number = 0;
	backgroundColor: string = "#000000";
	onBeforeFrame?: () => void;
	onAfterFrame?: () => void;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = this.canvas.getContext("2d");
		if (!ctx) throw new TypeError("Canvas must have 2D rendering context");
		this.ctx = ctx;
	}

	setBackgroundColor(color: string) {}

	play(animationFunction: (view: View) => ActionGenerator): void {
		const animation = animationFunction(this);
		const animationFrameFunction = (time: number) => {
			this.onBeforeFrame?.();
			if (this.lastTime === 0) this.lastTime = time;
			const delta = time - this.lastTime;
			this.ctx.strokeStyle = "";
			this.ctx.fillStyle = this.backgroundColor;
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			animation.next(delta);
			for (const component of this.components) {
				component.render(this.ctx, {
					parentGlobalX: 0,
					parentGlobalY: 0,
				});
			}
			this.lastTime = time;
			this.onAfterFrame?.();
			window.requestAnimationFrame(animationFrameFunction);
		};
		window.requestAnimationFrame(animationFrameFunction);
	}
	add(component: Component): void {
		this.components.push(component);
	}
}

export type ActionGenerator = Generator<undefined, undefined, number>;

export type RenderData = { parentGlobalX: number; parentGlobalY: number };


export class Component {
	x = useTween(0, TUtil.lerp);
	y = useTween(0, TUtil.lerp);
	parent?: Component;
	children: Component[] = [];
	render(
		ctx: CanvasRenderingContext2D,
		data: RenderData
	) {
		for (const child of this.children)
			child.render(ctx, {
				parentGlobalX: data.parentGlobalX + this.x(),
				parentGlobalY: data.parentGlobalY + this.y(),
			});
	}
	addChild(child: Component) {
		child.parent = this;
		this.children.push(child);
	}
	*moveBy(
		x: number,
		y: number,
		duration: number,
		easingFunction: EasingFunction = TUtil.easing.easeInOutQuad
	): ActionGenerator {
		const endX = this.x() + x;
		const endY = this.y() + y;

		yield* TUtil.parallel([
			this.x(endX, duration, easingFunction),
			this.y(endY, duration, easingFunction),
		]);
	}

	*moveTo(
		x: number,
		y: number,
		duration: number,
		easingFunction: EasingFunction = TUtil.easing.easeInOutQuad
	): ActionGenerator {
		yield* TUtil.parallel([
			this.x(x, duration, easingFunction),
			this.y(y, duration, easingFunction),
		]);
	}

	// Upsetting in terms of performance. Makes rendering the tree O(n^2)
	// Alternative could be to pass the data
	globalPosition(data: RenderData): { x: number; y: number } {
		return { x: this.x() + data.parentGlobalX, y: this.y() + data.parentGlobalY };
	}

	*interpolateNumber<K extends PropertyKey, T extends Record<K, number>>(
		obj: T,
		field: K,
		endValue: number,
		duration: number,
		easingFunction: (x: number) => number = TUtil.easing.easeInOutQuad
	): ActionGenerator {
		const startValue = obj[field] as number;
		let remaining = duration;

		while (remaining > 0) {
			const delta = yield;
			const t = easingFunction(1 - remaining / duration);

			obj[field] = TUtil.lerp(startValue, endValue, t) as T[typeof field];

			if (endValue >= 0) {
				obj[field] = Math.min(endValue, obj[field]) as T[typeof field];
			} else {
				obj[field] = Math.max(endValue, obj[field]) as T[typeof field];
			}
			remaining -= delta;
		}
	}
}

export function useTween<T>(
	value: T,
	interpolationFunction: (startValue: T, endValue: T, t: number) => T
): TweenFunction<T> {
	function tweener(): T;
	function tweener(
		newValue: T,
		duration?: number,
		easingFunction?: EasingFunction
	): ActionGenerator;
	function tweener(
		newValue?: T,
		duration?: number,
		easingFunction: EasingFunction = TUtil.easing.easeInOutQuad
	) {
		if (!newValue) {
			return value;
		}

		return (function* (): ActionGenerator {
			const startValue = value;
			let remaining = duration!;
			while (remaining > 0) {
				const delta = yield;
				value = interpolationFunction(
					startValue,
					newValue,
					easingFunction(1 - remaining / duration!)
				);
				remaining -= delta;
			}
		})();
	}
	return tweener;
}

export class TUtil {
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
