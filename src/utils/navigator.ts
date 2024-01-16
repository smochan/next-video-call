export const getNavigator = () => {
    return typeof window !== 'undefined' && window.navigator ? null : navigator; 
}