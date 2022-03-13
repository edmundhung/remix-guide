interface InputOptionProps {
	type: 'radio' | 'checkbox';
	label?: string;
	name: string;
	value?: string | null;
	checked: boolean;
}

function InputOption({ type, label, name, value, checked }: InputOptionProps) {
	const id = `${name}-${value ?? 'any'}`;

	return (
		<label
			htmlFor={id}
			className="cursor-pointer px-3 py-1.5 flex items-center gap-4"
		>
			<input
				id={id}
				className="h-4 w-4 border-gray-300 rounded text-blue-500 focus:ring-blue-500 ring-blue-500"
				type={type}
				name={name}
				value={value ?? ''}
				defaultChecked={checked}
			/>
			{label ?? value ?? ''}
		</label>
	);
}

export default InputOption;
