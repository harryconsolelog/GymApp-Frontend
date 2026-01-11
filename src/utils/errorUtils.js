export const parseErrorMessage = (error) => {
  let errorMessage = 'An error occurred';
  
  if (error.message) {
    try {
      const errorData = JSON.parse(error.message.match(/\{.*\}/)?.[0] || '{}');
      if (errorData.message && Array.isArray(errorData.message)) {
        errorMessage = `Validation Error:\n${errorData.message.join('\n')}`;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = error.message;
      }
    } catch (e) {
      errorMessage = error.message;
    }
  }
  
  return errorMessage;
};



