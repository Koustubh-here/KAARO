/**
 * AddTransactionScreen.js
 * Screen for adding new income or expense transactions with a calculator interface.
 * v1.2: Integrated with ThemeContext for light/dark mode support.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { createTransaction } from '../lib/db';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext'; // ADDED

// A helper component for the calculator buttons
const CalculatorButton = ({ onPress, text, style, textStyle }) => (
    <TouchableOpacity style={[styles.calcButton, style]} onPress={() => onPress(text)}>
        <Text style={[styles.calcButtonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
);

const AddTransactionScreen = ({ navigation, route }) => {
    const { theme } = useTheme(); // ADDED
    const { t } = useI18n();
    const { business } = useAuth();
    const { type = 'Expense', contactName = 'Contact' } = route.params || {};

    const [displayValue, setDisplayValue] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [expression, setExpression] = useState('');
    
    const [details, setDetails] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [bill, setBill] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const isExpense = (type || '').toLowerCase() === 'expense';
    const primaryColor = isExpense ? theme.colors.danger : theme.colors.success;

    const calculate = (firstOperand, secondOperand, operator) => {
        switch (operator) {
            case '+': return firstOperand + secondOperand;
            case '-': return firstOperand - secondOperand;
            case '×': return firstOperand * secondOperand;
            case '÷': return secondOperand === 0 ? 0 : firstOperand / secondOperand; // Avoid division by zero
            case '%': return firstOperand % secondOperand;
            default: return secondOperand;
        }
    };

    const handleCalculatorInput = (input) => {
        if (input === 'C') {
            setDisplayValue('0');
            setPreviousValue(null);
            setOperator(null);
            setWaitingForOperand(false);
            setExpression('');
        } else if (input === '⌫') {
            setDisplayValue(displayValue.length > 1 ? displayValue.slice(0, -1) : '0');
        } else if (['+', '-', '×', '÷', '%'].includes(input)) {
            const inputValue = parseFloat(displayValue);
            if (previousValue === null) {
                setPreviousValue(inputValue);
                setExpression(displayValue + ' ' + input);
            } else if (operator && !waitingForOperand) {
                const currentValue = previousValue || 0;
                const newValue = calculate(currentValue, inputValue, operator);
                setDisplayValue(String(newValue));
                setPreviousValue(newValue);
                setExpression(String(newValue) + ' ' + input);
            }
            setWaitingForOperand(true);
            setOperator(input);
        } else if (input === '=') {
            const inputValue = parseFloat(displayValue);
            if (previousValue !== null && operator) {
                const newValue = calculate(previousValue, inputValue, operator);
                setDisplayValue(String(newValue));
                setExpression('');
                setPreviousValue(null);
                setOperator(null);
                setWaitingForOperand(false);
            }
        } else if (input === '.') {
            if (waitingForOperand) {
                setDisplayValue('0.');
                setWaitingForOperand(false);
            } else if (!displayValue.includes('.')) {
                setDisplayValue(displayValue + '.');
            }
        } else { // Number input
            if (waitingForOperand) {
                setDisplayValue(String(input));
                setWaitingForOperand(false);
            } else {
                setDisplayValue(displayValue === '0' ? String(input) : displayValue + input);
            }
        }
    };

    const handleAttachBill = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Error', 'Could not select image.'); return; }
            if (response.assets && response.assets.length > 0) {
                setBill({ uri: response.assets[0].uri });
                Alert.alert('Success', 'Bill attached!');
            }
        });
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const handleSaveTransaction = async () => {
        const finalAmount = parseFloat(displayValue);
        if (!finalAmount || finalAmount <= 0) { Alert.alert(t('common.error'), 'Please enter a valid amount.'); return; }
        if (!business?.id) { Alert.alert(t('common.error'), t('common.tryAgain')); return; }

        setIsLoading(true);
        const payload = {
            description: details ? `${contactName}: ${details}` : contactName,
            amount: Number(finalAmount),
            category: null,
            date: date.toISOString().split('T')[0],
            type: isExpense ? 'expense' : 'income',
        };
        const { error } = await createTransaction(business.id, payload);
        setIsLoading(false);
        if (error) { Alert.alert(t('common.error'), error.message); return; }
        Alert.alert(
            t('addTransaction.successTitle'),
            t('addTransaction.successBody', { type }),
            [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
    };

    const calculatorButtons = [
        ['C', '⌫', '%', '÷'],
        ['7', '8', '9', '×'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '=']
    ];

    const getHeaderTitle = () => {
        if (isExpense) {
            return contactName && contactName !== 'Contact' ? `You gave to ${contactName}` : 'You gave';
        } else {
            return contactName && contactName !== 'Contact' ? `You got from ${contactName}` : 'You received';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{getHeaderTitle()}</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <View style={styles.amountDisplayContainer}>
                    <Text style={[styles.expressionText, { color: theme.colors.subtleText }]}>{expression || ' '}</Text>
                    <View style={styles.amountContainer}>
                        <Text style={[styles.amountSymbol, { color: theme.colors.subtleText }]}>₹</Text>
                        <Text style={[styles.amountText, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                            {parseFloat(displayValue).toLocaleString()}
                        </Text>
                    </View>
                </View>

                <TextInput
                    style={[styles.detailsInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="Enter details (Items, bill no., etc.)"
                    placeholderTextColor={theme.colors.subtleText}
                    value={details}
                    onChangeText={setDetails}
                />
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => setShowDatePicker(true)}>
                        <Icon name="calendar-today" size={20} color={theme.colors.subtleText} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.subtleText }]}>{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={handleAttachBill}>
                        <Icon name={bill ? "check-circle" : "camera-alt"} size={20} color={bill ? theme.colors.success : theme.colors.subtleText} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.subtleText }, bill && { color: theme.colors.success }]}>
                            {bill ? 'Bill Attached' : 'Attach bills'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={onDateChange}
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: primaryColor }, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSaveTransaction}
                    disabled={isLoading}
                >
                    <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
                        {isLoading ? 'SAVING...' : 'SAVE'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.calculator}>
                    {calculatorButtons.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.calculatorRow}>
                            {row.map((btn) => {
                                let btnStyle = { backgroundColor: theme.colors.surface };
                                let textStyle = { color: theme.colors.text };
                                if (btn === '0') btnStyle = { ...btnStyle, flex: 2.1 };
                                if (['÷', '×', '-', '+', '='].includes(btn)) {
                                    btnStyle = { ...btnStyle, backgroundColor: primaryColor };
                                    textStyle = { color: theme.colors.white };
                                }
                                if (['C', '⌫', '%'].includes(btn)) {
                                    btnStyle = { ...btnStyle, backgroundColor: theme.colors.background };
                                }
                                return (<CalculatorButton key={btn} text={btn} onPress={handleCalculatorInput} style={btnStyle} textStyle={textStyle} />);
                            })}
                        </View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingTop: 25,
        borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    headerTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
    placeholder: { width: 32 },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    amountDisplayContainer: {},
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    amountSymbol: {
        fontFamily: 'Poppins-Bold',
        fontSize: 32,
        marginRight: 8,
    },
    amountText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 64,
        textAlign: 'right',
    },
    expressionText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        textAlign: 'right',
        minHeight: 20,
        marginBottom: 4,
    },
    detailsInput: {
        borderRadius: 8,
        padding: 16,
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        marginTop: 24,
        borderWidth: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
    },
    actionButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        marginLeft: 8,
    },
    footer: {
        padding: 8,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
    },
    calculator: {
        paddingHorizontal: 4,
    },
    calculatorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    calcButton: {
        flex: 1,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 2,
    },
    calcButtonText: {
        fontSize: 24,
        fontWeight: '500',
    },
});

export default AddTransactionScreen;
