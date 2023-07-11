import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import pv from './index'

const test = suite(`param_validator`)

type Expect<T extends true> = T
type Equal<X, Y> = Expect<X extends Y ? (Y extends X ? true : false) : false>

test(`param_validator works or whatever`, () => {
	const validate = pv({
		some_num: pv.integer,
		some_string: pv.string,
		some_array_of_numbers: pv.array(pv.integer),
	})

	assert.equal(validate({
		some_num: `3`,
		some_string: `yup`,
		some_array_of_numbers: [ `4`, `5` ],
	}), {
		some_num: 3,
		some_string: `yup`,
		some_array_of_numbers: [ 4, 5 ],
	})

	assert.equal(validate({
		some_num: `3`,
		some_string: `yup`,
		some_array_of_numbers: `4`,
	}), {
		some_num: 3,
		some_string: `yup`,
		some_array_of_numbers: [ 4 ],
	})

	assert.throws(() => {
		validate({
			some_num: `three`,
			some_string: `yup`,
			some_array_of_numbers: [ `4`, `5` ],
		})
	}, /should be an integer/)

	assert.throws(() => {
		validate({
			some_string: `yup`,
			some_array_of_numbers: [ `4`, `5` ],
		})
	}, /some_num.*must be provided/)

	assert.throws(() => {
		validate({
			some_num: `3`,
			some_string: `yup`,
			some_array_of_numbers: [ `four` ],
		})
	}, /some_array_of_numbers\[0\].*should be an integer/)

	assert.throws(() => {
		validate({
			some_num: `3`,
			some_string: `yup`,
			some_array_of_numbers: `four`,
		})
	}, /some_array_of_numbers\[0\].*should be an integer/)
})

test(`Unspecified values should be stripped by default`, () => {
	const validate = pv({
		some_num: pv.integer,
	})

	const output = validate({
		some_num: `13`,
		// @ts-expect-error
		some_unknown_value: `sure why not`,
	})

	assert.equal(output, {
		some_num: 13,
	})
})

test(`optional array`, () => {
	const validate = pv({
		arr: pv.optional(pv.array(pv.boolean)),
	})

	assert.equal(validate({
		arr: `true`,
	}), {
		arr: [ true ],
	})

	assert.equal(validate({
		arr: [ `true`, `false` ],
	}), {
		arr: [ true, false ],
	})

	assert.equal(
		validate({	}),
		{}
	)
})

test(`If a property is optional, invalid values should not show up in the output`, () => {
	const validate = pv({
		cool: pv.optional(pv.boolean),
		power_level: pv.optional(pv.integer),
	}, { throw_on_invalid_optional_values: false })

	const output = validate({
		cool: `no`,
		power_level: `9000`,
	})

	assert.equal(
		output,
		{
			power_level: 9000,
		}
	)


	assert.equal(
		validate({
			cool: `true`,
			power_level: `OVER NINE THOUSAAAAAAND`,
		}),
		{
			cool: true,
		}
	)
})

test(`regex`, () => {
	const validate = pv({
		uppercase: pv.regex(/^[A-Z]+$/),
	})

	assert.equal(
		validate({
			uppercase: `YES`,
		}),
		{
			uppercase: `YES`,
		},
		`Should return the object without error`
	)

	assert.throws(() => {
		validate({
			uppercase: `no`,
		})
	}, /should match/)
})

test(`regex with custom message`, () => {
	const validate = pv({
		uppercase: pv.regex(/^[A-Z]+$/, `yow`),
	})

	assert.throws(() => {
		validate({
			uppercase: `no`,
		})
	}, /^yow$/)
})

test(`iso_date`, () => {
	const validate = pv({
		date: pv.iso_date,
	})

	assert.equal(
		validate({
			date: `1234-11-99`,
		}),
		{
			date: `1234-11-99`,
		}
	)

	assert.throws(() => {
		validate({
			date: `Tuesday the Eleventeenth`,
		})
	}, /iso date/i)
})

test(`one of several options`, async() => {
	const validate = pv({
		finalization: pv.one_of(`unfinalized`, `finalized`),
	})

	const validated = validate({
		finalization: `finalized`,
	})

	assert.equal(validated, { finalization: `finalized` })

	assert.throws(() => {
		validate({
			finalization: `whatever man`,
		})
	})

	const assert_type_finalization_should_be_union_type: Equal<typeof validated['finalization'], 'unfinalized' | 'finalized'> = true
})

test(`allow_non_specified_values lets you pass other stuff through`, () => {
	const validate = pv({
		some_known_thing: pv.integer,
	}, { allow_non_specified_values: true })

	const output = validate({
		some_known_thing: `13`,
		some_unknown_thing: `sure`,
	})

	let assert_type_of_some_known_thing_is_number: Equal<typeof output['some_known_thing'], string>
	let assert_type_of_some_unknown_thing_is_string: Equal<typeof output['some_unknown_thing'], string>

	assert.equal(output, {
		some_known_thing: 13,
		some_unknown_thing: `sure`,
	})
})

test.run()
