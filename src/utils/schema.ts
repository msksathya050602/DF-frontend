import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid Email address').required('Email address is required'),
  password: yup.string().required('Password is required'),
});

export const signUpSchema = yup.object({
  userName: yup
    .string()
    .min(2, 'Username must be at least 2 characters')
    .required('Username is required'),
  email: yup.string().email('Invalid Email address').required('Email address is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

export const uploadFieldSchema = yup.object().shape({
  variant: yup
    .string()
    .oneOf(['diagnosis', 'treatment', 'both'], 'Invalid Selection')
    .required('Field required'),
  name: yup.string().required('Name is required'),
  age: yup.string().required('Age is required'),
  type: yup.string().oneOf(['XRay', 'CBCT', 'Image']).required('Field required'),
  notation: yup
    .string()
    .oneOf(['FDI', 'Universal'], 'Invalid Selection')
    .when(['type'], (type: string[], schema) =>
      ['XRay', 'CBCT'].some((item) => type.includes(item))
        ? schema.required('Field Required')
        : schema.notRequired()
    ),
  xray: yup
    .string()
    .oneOf(['Periapical', 'Bitewing', 'Panoramic'], 'Invalid Selection')
    .when(['type'], (type: string[], schema) =>
      ['XRay'].some((item) => type.includes(item))
        ? schema.required('Field Required')
        : schema.notRequired()
    ),

  cbct: yup
    .string()
    .oneOf(['Upper', 'lower', 'both'], 'Invalid Selection')
    .when(['type'], (type: string[], schema) =>
      ['CBCT'].some((item) => type.includes(item))
        ? schema.required('Field Required')
        : schema.notRequired()
    ),
  model: yup.string().oneOf(['Basic', 'Advance'], 'Invalid Selection').required('Field Required'),
  selectedTooths: yup
    .array(yup.string())
    .typeError('Selection is required')
    .min(1, 'Selection is required')
    .when(['type'], (type: string[], schema) =>
      ['XRay'].some((item) => type.includes(item))
        ? schema.required('Field Required')
        : schema.notRequired()
    ),
});

export const updateReportSchema = yup.object().shape({
  name: yup.string().notRequired(),
  age: yup.string().notRequired(),
  reportType: yup.string().oneOf(['XRay', 'CBCT', 'Image', '']).notRequired(),
  numberingSystem: yup.string().oneOf(['FDI', 'Universal', ''], 'Invalid Selection').notRequired(),
  diagnosis: yup.string().notRequired(),
  treatment: yup.string().notRequired(),
  selectedTooths: yup
    .array(yup.string())
    .typeError('Selection is required')
    .min(1, 'Selection is required')
    .notRequired(),
});
