import pandas as pd
import numpy as np
from itertools import combinations
from sklearn.linear_model import LinearRegression
from tabulate import tabulate
import matplotlib.pyplot as plt
from random import shuffle

CONST_DIFF = 4

def feature_selection(df_train, df_test):
    """selecting the significant features to see if we can reach the true value with fewer features"""
    chosen_questions = set()
    best_questions_per_iteration = []  # questions chosen for each iteration

    max_value = 0
    chosen_group = ()
    for j in range(1, 9):
        """going over all the questions"""
        comb = combinations(range(8), j)  # [0,1,2,3,4,5,6,7]
        score_list = []
        #[[0,1], [0,2], [], []]
        for group in list(comb):
            """going over all possible combinations for group of size j"""

            train_data = df_train.iloc[:, list(group)]
            test_data = df_test.iloc[:, list(group)]
            y_true = df_train['sum']

            # feature selection
            model = LinearRegression()
            model.fit(train_data, y_true)
            score = model.score(test_data, df_test['sum'])
            if score > max_value:
                max_value = score
                chosen_group = group
            score_list.append(round(score, 2))

        # plot_graph(score_list)
        chosen_questions.add(chosen_group)
        best_questions_per_iteration.append({chosen_group:round(max_value, 2)})
    print("chosen_questions: ", chosen_questions)
    print("best_questions_per_iteration: ", best_questions_per_iteration)

    #prediction against chosen group of size 5
    train_data = df_train.iloc[:, 1:6]
    test_data = df_test.iloc[:, 1:6]
    # feature selection
    model = LinearRegression()
    model.fit(train_data, y_true)
    # score = model.score(test_data, df_test['sum'])
    prediction = model.predict(test_data)
    print("len: ", len(model.predict(test_data)), "prediction: ", prediction)
    print("len: ", len(df_test['sum']), "true: ", list(df_test['sum']))


def plot_graph(x):
    """plotting a bar graph for train and test df"""
    x1 = np.arange(1, 8, step=1)
    x2 = np.arange(0, 1, step=0.1)
    ax = plt.subplot(111)
    plt.xlabel('questions')
    plt.ylabel('score')
    plt.title('Bar Graph for TRAIN group')
    ax.bar(range(len(x)), height=x, color='b', align='center', label="true")

    plt.show()


def count_missing(df, name_column):
    """counts how many 0 values in every feature"""
    missing = len(df[df[name_column] == 0])
    rate = missing/len(df[name_column])
    return missing, round(rate, 3)


def train_test_division(df, list_lines):
    """divides the data into two groups as follows:
    70% of the data is for train and 30% for test"""
    train_df = df.loc[list_lines[:int(len(list_lines) * 0.7)]].copy()
    test_df = df.loc[list_lines[int(len(list_lines) * 0.7):]].copy()
    assert (len(list_lines) == (len(train_df) + len(test_df)))
    return train_df, test_df


def train_test_relative_division(df, list_lines):
    """Divides data into train and test groups in a way that the division will
    be better relativeness by shuffling data before division"""
    # shuffle(list_lines)
    train_df, test_df = train_test_division(df, list_lines)
    return train_df, test_df


if __name__ == '__main__':

    titles = ['זמן התחלה', 'סדר', 'GLM', 'יעילות', 'איכות', 'עצמאות', 'הבנה', 'התרשמות', 'סכום']


    # ----1---- :
    """reading data into data frame"""
    cols = ['1', '2', '3', '4', '5', '6', '7', '8', 'sum']
    df = pd.read_csv("Book1.csv", usecols=cols)
    df_students = df.iloc[::2]  # even - only students
    df_guides = df.iloc[1::2]  # odd - only guides
    print("----------------------------------------------------------------")
    # assert (len(df) == 106)

    # ----2----:
    """counting how many missing values in every feature"""
    tabulate_columns = []
    non_zero_rows = []
    for i in range(1, 9):
        missing_amount, missing_rate = count_missing(df, str(i))
        tabulate_columns.append([str(i), missing_amount, missing_rate])
    print('----2----\n'+tabulate(tabulate_columns, headers=['Tool', 'NO. of missing', 'Missing rate'], tablefmt='orgtbl'))

    # ----3----:
    """taking only the rows that are not zeroes"""
    non_zero_rows = df[(df['1'] != 0) & (df['2'] != 0) & (df['3'] != 0) & (df['4'] != 0) & (df['5'] != 0) & (df['6'] != 0)
         & (df['7'] != 0) & (df['8'] != 0)].index.tolist()
    # print("non zeroes - guide & student: ", non_zero_rows)

    student_non_zero_rows = df_students[(df_students['1'] != 0) & (df_students['2'] != 0) & (df_students['3'] != 0) & (df_students['4'] != 0) & (df_students['5'] != 0) & (df_students['6'] != 0)
         & (df_students['7'] != 0) & (df_students['8'] != 0)].index.tolist()
    # print("non zeroes - student: ", student_non_zero_rows)

    guide_non_zero_rows = df_guides[(df_guides['1'] != 0) & (df_guides['2'] != 0) & (df_guides['3'] != 0) & (df_guides['4'] != 0) & (df_guides['5'] != 0) & (df_guides['6'] != 0)
         & (df_guides['7'] != 0) & (df_guides['8'] != 0)].index.tolist()
    # print("non zeroes - guide: ", guide_non_zero_rows)


    # ----4----:
    """deviding the data into two groups, train and test"""
    train_df, test_df = train_test_relative_division(df, non_zero_rows)
    student_train, student_test = train_test_relative_division(df_students, student_non_zero_rows)
    guide_train, guide_test = train_test_relative_division(df_guides, guide_non_zero_rows)

    # -----5----:
    """feature selection"""
    print('\n---- students & guides ----')
    feature_selection(train_df, test_df)
    print('\n---- students ----')
    feature_selection(student_train, student_test)
    print('\n---- guides ----')
    feature_selection(guide_train, guide_test)

