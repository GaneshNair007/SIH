import numpy as np, json
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split

X = np.load('work/X.npy'); y = np.load('work/y.npy')
Xtr, Xval, ytr, yval = train_test_split(X, y, test_size=0.2, random_state=0)
mu = Xtr.mean(axis=0); sigma = Xtr.std(axis=0)+1e-8
Xtr_n = (Xtr-mu)/sigma; Xval_n = (Xval-mu)/sigma

mlp = MLPRegressor(hidden_layer_sizes=(12,6), activation='relu', solver='adam',
                    alpha=1e-4, max_iter=4000, early_stopping=True, n_iter_no_change=30, random_state=0)
mlp.fit(Xtr_n, ytr)
pred = mlp.predict(Xval_n)
rmse = float(np.sqrt(np.mean((pred-yval)**2)))
print('final val rmse (log10s):', rmse, 'x', 10**rmse)

export = {
    'featureMean': mu.tolist(),
    'featureStd': sigma.tolist(),
    'layers': [
        {'W': mlp.coefs_[0].tolist(), 'b': mlp.intercepts_[0].tolist(), 'act':'relu'},
        {'W': mlp.coefs_[1].tolist(), 'b': mlp.intercepts_[1].tolist(), 'act':'linear'},
        {'W': mlp.coefs_[2].tolist(), 'b': mlp.intercepts_[2].tolist(), 'act':'linear'}
    ],
    'rmse': rmse
}
with open('work/mlp_export.json','w') as f:
    json.dump(export, f)
print('shapes:', [c.shape for c in mlp.coefs_])
